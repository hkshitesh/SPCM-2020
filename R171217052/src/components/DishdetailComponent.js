import React, { Component } from 'react';
import { Card, CardImg, CardBody, CardTitle, CardText, 
        Breadcrumb, BreadcrumbItem, Button, Modal, ModalBody, 
        ModalHeader, Row, Col, Label } from 'reactstrap';
import { Link } from 'react-router-dom';
import { LocalForm, Control, Errors } from 'react-redux-form';
import { Loading } from './LoadingComponent';

    function RenderDish({dish}) {
		return(
            <div className="col-12 col-md-5 m-1 mt-4">
				<Card>
					<CardImg width="100%" src={dish.image} alt={dish.name} />
					<CardBody>
						<CardTitle>{dish.name}</CardTitle>
						<CardText>{dish.description}</CardText>
					</CardBody>	
				</Card>
            </div>                   
		);
    }

    const required = (val) => val && val.length;
    const maxLength = (len) => (val) => !(val) || (val.length <= len);
    const minLength = (len) => (val) => (val) && (val.length >= len);

    class CommentForm extends Component {

        constructor(props) {
            super(props);
            this.state = {
                isModalOpen: false
            }

            this.toggleModal = this.toggleModal.bind(this);
        }

        handleSubmit(values) {
            this.toggleModal();
            this.props.addComment( this.props.dishId, values.rating, values.author, values.comment );
        }

        toggleModal() {
            this.setState( {isModalOpen: !this.state.isModalOpen} )
        }

        render() {
            
            return(
                <>
                    <Button outline onClick={this.toggleModal}>
                        <span className="fa fa-pencil fa-lg"></span>Submit Comment
                    </Button>
                    <Modal isOpen={this.state.isModalOpen} toggle={this.toggleModal}>
                    <ModalHeader toggle={this.toggleModal}>Submit Comment</ModalHeader>
                        <ModalBody>
                            <LocalForm onSubmit={(values) => this.handleSubmit(values)}>
                                <Row className="form-group">
                                    <Col>
                                        <Label htmlFor="rating">Rating</Label>
                                        <Control.select model=".rating" 
                                                        name="rating"  
                                                        className="form-control">
                                            <option>1</option>
                                            <option>2</option>
                                            <option>3</option>
                                            <option>4</option>
                                            <option>5</option> 
                                        </Control.select>
                                    </Col>
                                </Row>
                                <Row className="form-group">
                                    <Col>
                                        <Label htmlFor="author">Your Name</Label>
                                        <Control.text model=".author" 
                                                        name="author" 
                                                        className="form-control"     
                                                        validators={{
                                                            required, 
                                                            minLength: minLength(3), 
                                                            maxLength: maxLength(15)
                                                        }}
                                        />
                                        <Errors class="text-danger"
                                                model=".yourName"
                                                show="touched"
                                                messages={{
                                                    required: 'Required-',
                                                    minLength: 'Must be greater than 2 characters',
                                                    maxLength: 'Must be 15 characters or less'
                                                }}
                                        /> 
                                    </Col>
                                </Row>
                                <Row className="form-group">
                                    <Col>
                                        <Label htmlFor="comment">Comment</Label>
                                        <Control.textarea model=".comment" 
                                                        name="comment" 
                                                        className="form-control"
                                                        rows="5"     
                                        />
                                    </Col>
                                </Row>
                                <Row className="form-group">
                                    <Col>
                                        <Button type="submit" color="primary">
                                            Submit
                                        </Button>
                                    </Col>
                                </Row>
                            </LocalForm>
                        </ModalBody>
                    </Modal>
                </>
            ); 
        }
    }

    function RenderComments({comments, addComment, dishId}) {
        
        if (comments != null) 
        { 
            let options = { year: "numeric", month: "short", day: "2-digit" };
            const cmnts = comments.map (comment => {
                return (
                            <li key={comment.id}>
                                <p>{comment.comment}</p>
                                <p>
                                    -- {comment.author} , 
                                    {new Date(comment.date).toLocaleDateString("en-US", options)}
                                </p>
                            </li>
                        )
                });
                
            return (
                <div className="col-12 col-md-5 m-1 mt-4">
                    <h4>Comments</h4>
                    <ul className="list-unstyled">
                        {cmnts}
                    </ul>
                    <CommentForm dishId={dishId} addComment={addComment} />
                </div>
            );    
        }

        else 
            return(
                <div></div>
            );
        
    }

    const Dishdetail = (props) => {
        
        if(props.isLoading) {
            return (
            <div className="container">
                <div className="row">
                    <Loading />
                </div>
            </div>
            );
        }
        else if (props.errMess) {
            return (
                <div className="container">
                    <div className="row">
                        <h4>{props.errMess}</h4>
                    </div>
                </div>
            );
        }

        if(props.dish == null)
        {
            return(<div></div>)
        }
        else
        {
        return(
            <div className="container">
                <div className="row">
                    <Breadcrumb>
                        <BreadcrumbItem><Link to='/menu'>Menu</Link></BreadcrumbItem>
                        <BreadcrumbItem active>{props.dish.name}</BreadcrumbItem>
                    </Breadcrumb>
                    <div className="col-12">
                        <h3>
                            {props.dish.name}
                        </h3>
                        <hr />
                    </div>
                </div>
                <div className="row">
                    <RenderDish dish={props.dish} />
                    <RenderComments comments={props.comments} 
                                    addComment={props.addComment}
                                    dishId={props.dish.id} />
                </div>
            </div>             
            )
        }
    }

export default Dishdetail;